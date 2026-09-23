const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const allowedRoles = ['farmer', 'buyer', 'fpo'];

        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                message: 'Invalid role'
            });
        }

        const checkSql = 'SELECT id FROM users WHERE email = ?';

        db.query(checkSql, [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: 'Database error'
                });
            }

            if (results.length > 0) {
                return res.status(409).json({
                    message: 'Email already registered'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const insertSql = `
                INSERT INTO users (name, email, password, role)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [name, email, hashedPassword, role],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: 'Registration failed'
                        });
                    }

                    res.status(201).json({
                        message: 'Registration successful',
                        userId: result.insertId
                    });
                }
            );
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: 'Email, password and role are required'
            });
        }

        const sql = 'SELECT * FROM users WHERE email = ? AND role = ?';

        db.query(sql, [email, role], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: 'Database error'
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: 'Invalid email, password or role'
                });
            }

            const user = results[0];

            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    message: 'Invalid email, password or role'
                });
            }

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
});

module.exports = router;