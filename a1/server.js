const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const database = new DatabaseSync(path.join(root, 'lms.sqlite'));
database.exec(fs.readFileSync(path.join(root, 'schema.sql'), 'utf8'));

// Dynamic schema migrations to safely add new columns to existing database
try { database.exec(`ALTER TABLE events ADD COLUMN token_id TEXT;`); } catch (e) {}
try { database.exec(`ALTER TABLE events ADD COLUMN subject TEXT;`); } catch (e) {}
try { database.exec(`ALTER TABLE events ADD COLUMN member_id INTEGER;`); } catch (e) {}
try { database.exec(`ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'progress';`); } catch (e) {}
try { database.exec(`ALTER TABLE events ADD COLUMN images TEXT;`); } catch (e) {}
try { database.exec(`ALTER TABLE events ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;`); } catch (e) {}


const insertUser = database.prepare(`
    INSERT INTO users (full_name, email, role, password_hash)
    VALUES (?, ?, ?, ?)
`);

const findUserByEmail = database.prepare(`
    SELECT * FROM users WHERE email = ?
`);

// Seed default admin account if not already created
try {
    const existingAdmin = findUserByEmail.get('admin123@gmail.com');
    if (!existingAdmin) {
        insertUser.run('Admin', 'admin123@gmail.com', 'Administrator', hashPassword('aithentchn'));
    }
} catch (e) {
    console.error('Admin seeding notice:', e.message);
}

const updateUserPassword = database.prepare(`
    UPDATE users
    SET password_hash = ?
    WHERE email = ?
`);

const insertEvent = database.prepare(`
    INSERT INTO events (user_id, title, description, token_id, subject, member_id, status, event_date, start_time, end_time, color, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateEvent = database.prepare(`
    UPDATE events
    SET title = ?, description = ?, token_id = ?, subject = ?, member_id = ?, status = ?, event_date = ?, start_time = ?, end_time = ?, color = ?, images = ?, created_at = CURRENT_TIMESTAMP
    WHERE id = ?
`);

const selectAllEvents = database.prepare(`
    SELECT * FROM events ORDER BY created_at DESC, id DESC
`);

const deleteEventById = database.prepare(`
    DELETE FROM events WHERE id = ?
`);

const deleteUserById = database.prepare(`
    DELETE FROM users WHERE id = ?
`);

const unassignUserEvents = database.prepare(`
    UPDATE events SET member_id = NULL WHERE member_id = ?
`);

const findUserById = database.prepare(`
    SELECT id, full_name, email, role, created_at FROM users WHERE id = ?
`);

const selectAllUsers = database.prepare(`
    SELECT id, full_name, email, role FROM users ORDER BY full_name ASC
`);

const updateUserProfile = database.prepare(`
    UPDATE users
    SET full_name = ?, role = ?
    WHERE id = ?
`);

const updateUserProfileWithPassword = database.prepare(`
    UPDATE users
    SET full_name = ?, role = ?, password_hash = ?
    WHERE id = ?
`);

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedPasswordHash) {
    const [salt, hash] = storedPasswordHash.split(':');
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === verifyHash;
}

function sendJson(response, status, data) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(data));
}

function readBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => {
            body += chunk;
            if (body.length > 50_000_000) {
                request.destroy();
                reject(new Error('Request body is too large'));
            }
        });
        request.on('end', () => resolve(body));
        request.on('error', reject);
    });
}

function contentType(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    return {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.svg': 'image/svg+xml'
    }[extension] || 'application/octet-stream';
}

function serveFile(request, response) {
    const requestedPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
    const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.slice(1);
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(root + path.sep)) {
        sendJson(response, 403, { error: 'Forbidden' });
        return;
    }

    fs.readFile(filePath, (error, file) => {
        if (error) {
            sendJson(response, 404, { error: 'File not found' });
            return;
        }
        response.writeHead(200, { 'Content-Type': contentType(filePath) });
        response.end(file);
    });
}

const server = http.createServer(async (request, response) => {
    const parsedUrl = new URL(request.url, `http://${request.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (request.method === 'POST' && pathname === '/api/register') {
        try {
            const data = JSON.parse(await readBody(request));
            const fullName = String(data.fullName || '').trim();
            const email = String(data.email || '').trim().toLowerCase();
            const role = String(data.role || '').trim();
            const password = String(data.password || '');

            if (!fullName || !email || !role || password.length < 4) {
                sendJson(response, 400, { error: 'All fields are required and the password must have at least 4 characters.' });
                return;
            }

            insertUser.run(fullName, email, role, hashPassword(password));
            sendJson(response, 201, { message: 'Registration successful.' });
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                sendJson(response, 409, { error: 'This email is already registered.' });
                return;
            }
            console.error(error);
            sendJson(response, 500, { error: 'Unable to save the registration.' });
        }
        return;
    }

    if (request.method === 'POST' && pathname === '/api/login') {
        try {
            const data = JSON.parse(await readBody(request));
            const email = String(data.email || '').trim().toLowerCase();
            const password = String(data.password || '');

            if (!email || !password) {
                sendJson(response, 400, { error: 'Email and password are required.' });
                return;
            }

            const user = findUserByEmail.get(email);
            if (!user || !verifyPassword(password, user.password_hash)) {
                sendJson(response, 401, { error: 'Invalid email or password.' });
                return;
            }

            sendJson(response, 200, {
                message: 'Login successful.',
                user: {
                    id: user.id,
                    fullName: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'An error occurred during sign-in.' });
        }
        return;
    }

    if (request.method === 'POST' && pathname === '/api/reset-password') {
        try {
            const data = JSON.parse(await readBody(request));
            const email = String(data.email || '').trim().toLowerCase();
            const password = String(data.password || '');

            if (!email || !password || password.length < 6) {
                sendJson(response, 400, { error: 'Email is required and the password must have at least 6 characters.' });
                return;
            }

            const user = findUserByEmail.get(email);
            if (!user) {
                sendJson(response, 404, { error: 'This email is not registered.' });
                return;
            }

            updateUserPassword.run(hashPassword(password), email);
            sendJson(response, 200, { message: 'Password updated successfully.' });
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'Unable to reset password.' });
        }
        return;
    }

    if (request.method === 'GET' && pathname === '/api/profile') {
        try {
            const userId = Number(parsedUrl.searchParams.get('userId'));
            if (!userId) {
                sendJson(response, 400, { error: 'userId parameter is required.' });
                return;
            }
            const user = findUserById.get(userId);
            if (!user) {
                sendJson(response, 404, { error: 'User not found.' });
                return;
            }
            sendJson(response, 200, user);
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'Failed to fetch user profile.' });
        }
        return;
    }

    if (request.method === 'POST' && pathname === '/api/profile') {
        try {
            const data = JSON.parse(await readBody(request));
            const userId = Number(data.userId);
            const fullName = String(data.fullName || '').trim();
            const role = String(data.role || '').trim();
            const password = String(data.password || '');

            if (!userId || !fullName || !role) {
                sendJson(response, 400, { error: 'userId, fullName, and role are required.' });
                return;
            }

            if (password) {
                if (password.length < 4) {
                    sendJson(response, 400, { error: 'Password must have at least 4 characters.' });
                    return;
                }
                updateUserProfileWithPassword.run(fullName, role, hashPassword(password), userId);
            } else {
                updateUserProfile.run(fullName, role, userId);
            }

            sendJson(response, 200, { message: 'Profile updated successfully.' });
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'Failed to update user profile.' });
        }
        return;
    }

    if (request.method === 'GET' && pathname === '/api/users') {
        try {
            const users = selectAllUsers.all();
            sendJson(response, 200, users);
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'Failed to fetch users.' });
        }
        return;
    }

    if (request.method === 'DELETE' && pathname === '/api/users') {
        try {
            const id = Number(parsedUrl.searchParams.get('id'));
            if (!id) {
                sendJson(response, 400, { error: 'User id parameter is required.' });
                return;
            }
            unassignUserEvents.run(id);
            deleteUserById.run(id);
            sendJson(response, 200, { message: 'User removed successfully.' });
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'Failed to delete user.' });
        }
        return;
    }

    if (request.method === 'GET' && pathname === '/api/events') {
        try {
            const events = selectAllEvents.all();
            sendJson(response, 200, events);
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'Failed to fetch events.' });
        }
        return;
    }

    if (request.method === 'POST' && pathname === '/api/events') {
        try {
            const data = JSON.parse(await readBody(request));
            const id = data.id ? Number(data.id) : null;
            const userId = Number(data.userId);
            const title = String(data.title || '').trim();
            const description = String(data.description || '').trim();
            const tokenId = data.tokenId ? String(data.tokenId).trim() : null;
            const subject = data.subject ? String(data.subject).trim() : null;
            const memberId = data.memberId ? Number(data.memberId) : null;
            const status = data.status ? String(data.status).trim() : 'progress';
            const eventDate = String(data.eventDate || '').trim();
            const startTime = String(data.startTime || '').trim();
            const endTime = String(data.endTime || '').trim();
            const color = String(data.color || 'blue').trim();
            const images = data.images ? String(data.images).trim() : null;

            if (!userId || !title || !eventDate || !color) {
                sendJson(response, 400, { error: 'userId, title, eventDate, and color category are required.' });
                return;
            }

            if (id) {
                updateEvent.run(title, description, tokenId, subject, memberId, status, eventDate, startTime, endTime, color, images, id);
                sendJson(response, 200, { message: 'Event updated successfully.' });
            } else {
                const info = insertEvent.run(userId, title, description, tokenId, subject, memberId, status, eventDate, startTime, endTime, color, images);
                sendJson(response, 201, { message: 'Event created successfully.', id: info.lastInsertRowid });
            }
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'Failed to save event.' });
        }
        return;
    }

    if (request.method === 'DELETE' && pathname === '/api/events') {
        try {
            const id = Number(parsedUrl.searchParams.get('id'));
            if (!id) {
                sendJson(response, 400, { error: 'Event id parameter is required.' });
                return;
            }
            deleteEventById.run(id);
            sendJson(response, 200, { message: 'Event deleted successfully.' });
        } catch (error) {
            console.error(error);
            sendJson(response, 500, { error: 'Failed to delete event.' });
        }
        return;
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
        serveFile(request, response);
        return;
    }

    sendJson(response, 405, { error: 'Method not allowed' });
});

server.listen(port, () => {
    console.log(`LMS is running at http://localhost:${port}`);
    console.log(`SQLite database: ${path.join(root, 'lms.sqlite')}`);
});
