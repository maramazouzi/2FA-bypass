const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
    secret: '2fa-bypass-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// User database with predefined victim account
const users = {
    'sgxyvv': {
        password: 'owkiuq',
        email: 'victim@example.com',
        verified: false,
        isVictim: true  
    }
};

const verificationCodes = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ur_email_address@gmail.com', // Replace with your Gmail
        pass: 'ur_email_password'     // Replace with app-specific password
    }
});


app.get('/', (req, res) => {
    res.redirect('/login');
});


app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    users[username] = { email, password, verified: false };
    res.redirect('/login');
});


app.get('/login', (req, res) => {
    res.render('login', { error: req.query.error });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (users[username] && users[username].password === password) {
        req.session.username = username;
        req.session.loggedIn = true;
        
        // Generate and store verification code 1-100
        const code = Math.floor(1 + Math.random() * 100);
        verificationCodes[username] = code;
        console.log(`Verification code for ${username}: ${code}`);
        
        // Send email with verification code
        transporter.sendMail({
            to: users[username].email,
            subject: 'Verification Code',
            text: `Your verification code is: ${code}`
        }, (error, info) => {
            if (error) {
                console.log('Email sending error:', error);
                return res.redirect('/verify');
            }
            console.log('Email sent:', info.response);
            res.redirect('/verify');
        });
    } else {
        res.redirect('/login?error=invalid_credentials');
    }
});


app.get('/verify', (req, res) => {
    if (!req.session.loggedIn) return res.redirect('/login');
    res.render('verify', { error: req.query.error });
});

app.post('/verify', (req, res) => {
    const { code } = req.body;
    const username = req.session.username;
    
    if (verificationCodes[username] == code) {
        users[username].verified = true;
        req.session.verified = true;
    }
    
    req.session.verified = true;
    res.redirect('/my-account');
});

//Shows flag forvictim
app.get('/my-account', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }
    
    const username = req.session.username;
    const user = users[username];
    const flag = user && user.isVictim 
        ? 'april6_hello' 
        : 'Welcome to Your account!';
    
    res.render('my-account', { 
        username: username,
        flag: flag
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});