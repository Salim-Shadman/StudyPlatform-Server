# StudyPlatform - Backend (Server-Side)

This is the server-side code for the StudyPlatform project, built with Node.js and Express.js. This server provides a REST API to handle all data management, authentication, and payment-related tasks for the platform.

---

## 🔗 Live API URL

**Live API Endpoint:** `https://a-12-server-psi.vercel.app`

---

## 🔑 Admin Credentials

This system does not have a separate admin registration process. **The very first user who registers on the site will automatically be assigned the 'admin' role.**

---

## ✨ Features

* **JWT Authentication:** Secure API endpoints using JSON Web Tokens.
* **Role-Based Authorization:** Separate permissions for Students, Tutors, and Admins are enforced on all relevant routes.
* **User Management:** Admins can view all users, search them, and change their roles.
* **Session Management:** Tutors can create sessions, and Admins can approve or reject them.
* **Material Management:** Tutors can upload study materials, and Admins can manage them.
* **Payment Integration:** Securely handles payment processing for session bookings using Stripe.
* **CRUD Operations:** Full CRUD (Create, Read, Update, Delete) functionality for notes, reviews, sessions, and materials.

---

## 🛠️ Technology Stack

* **Framework:** Node.js, Express.js
* **Database:** MongoDB (with Mongoose)
* **Authentication:** JSON Web Token (JWT)
* **Password Hashing:** bcrypt.js
* **Payment Gateway:** Stripe
* **Others:** cors, dotenv

---

## 🚀 Local Setup and Installation

Follow these steps to run the project on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/study-platform-server.git](https://github.com/your-username/study-platform-server.git)
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd study-platform-server
    ```

3.  **Install the necessary packages:**
    ```bash
    npm install
    ```

4.  **Create an Environment File:**
    Create a `.env` file in the root directory and add the following variables. You can use an `.env.sample` file as a template if one is available.

    ```env
    # Server Port
    PORT=5000

    # MongoDB Connection URI
    DB_URI="your_mongodb_connection_string"

    # JWT Secret Key
    ACCESS_TOKEN_SECRET="your_jwt_secret_key"

    # Stripe Secret Key
    STRIPE_SECRET_KEY="your_stripe_secret_key"
    ```

5.  **Start the development server:**
    ```bash
    npm start
    ```

---