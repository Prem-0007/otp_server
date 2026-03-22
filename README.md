OTP Server
A lightweight Node.js REST API for generating, sending, and verifying one-time passwords (OTPs) via email using SendGrid and MongoDB.

Features
Generates secure 6-digit OTPs
Sends OTPs to any email address via SendGrid
Stores OTPs in MongoDB with automatic expiry (60 seconds)
Rate limiting — 30-second cooldown per email address
Tech Stack
Node.js — Runtime
Express.js — Web framework
MongoDB + Mongoose — Database and ODM
SendGrid — Email delivery
dotenv — Environment variable management
Prerequisites
Node.js 18+
A MongoDB database (e.g. MongoDB Atlas)
A SendGrid account with a verified sender email
Setup
Clone the repository

git clone <repo-url>
cd otp_server
Install dependencies

npm install
Configure environment variables

Create a .env file in the otp_server directory (or set them in your environment):

MONGO_URI=your_mongodb_connection_string
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=your_verified_sender@example.com
PORT=8080
Start the server

node server.js
The server will start on port 8080 (or the port defined in PORT).

API Reference
Send OTP
POST /send-otp

Generates a 6-digit OTP, saves it to the database, and emails it to the user.

Request body:

{
  "email": "user@example.com"
}
Responses:

Message	Description
OTP sent ✅	OTP generated and emailed successfully
Email required ❌	No email provided in the request
Wait X sec ⏳	Rate limit active — try again after the countdown
Error sending OTP ❌	Server or email delivery error
Verify OTP
POST /verify-otp

Validates a submitted OTP for the given email address.

Request body:

{
  "email": "user@example.com",
  "otp": "123456"
}
Responses:

Message	Description
OTP verified ✅	OTP is valid and has been consumed
Invalid OTP ❌	OTP does not match
OTP expired ⏳	OTP was not used within 60 seconds
Error verifying OTP ❌	Server error
Testing
You can test the endpoints using curl:

Send an OTP:

curl -X POST http://localhost:8080/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
Verify an OTP:

curl -X POST http://localhost:8080/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otp": "123456"}'
Notes
OTPs expire automatically after 60 seconds
Only one active OTP is allowed per email at a time
A new OTP cannot be requested for the same email within 30 seconds of the last request
