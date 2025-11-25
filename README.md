# Expense Tracker Backend API

A robust Node.js/Express REST API for expense tracking with MongoDB, JWT authentication, AWS integration, and Google Cloud services.

##  Features

- **User Authentication** - JWT-based secure authentication
- **Expense Management** - CRUD operations for expenses
- **Budget Tracking** - Budget creation and monitoring
- **File Upload** - Profile picture and receipt uploads
- **AWS Integration** - S3 storage, Lambda functions, Cost Explorer
- **Google Cloud AI** - Speech-to-text and AI Platform integration
- **Report Generation** - Automated expense reports
- **RESTful API** - Clean, documented API endpoints
- **Data Validation** - Comprehensive input validation
- **Error Handling** - Structured error responses

##  Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose 8.14.1
- **File Upload**: Multer 1.4.5
- **Cloud Services**: 
  - AWS SDK v3 (S3, Lambda, Cost Explorer, Budgets)


##  Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- AWS Account (for cloud features)
- Google Cloud Account (for AI features)

##  Installation

1. **Clone the repository**
   ```bash
   git clone <https://github.com/jujuGthb/expense_tracker_backend>
   cd expense-tracker-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGO_URI=mongodb://localhost:27017/expense-tracker
   # or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/expense-tracker
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   
   # Google Cloud Credentials (JSON format)
   GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"your-project",...}
   
  
   ```

4. **Start the development server**
   ```bash
   # Development with nodemon
   npm run dev
   
   # Production
   npm start
   ```

5. **Verify the server**
   Navigate to `http://localhost:5000` - you should see "API running..."


##  Testing

```bash
# Run tests (when implemented)
npm test

You can customize the URLs, email addresses, and specific details to match your actual repositories and deployment URLs.

