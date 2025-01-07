# ExamManager Deployment Guide

## Prerequisites
1. Azure Account with Active Directory access
2. Domain name (optional)
3. Web hosting service (e.g., Azure Static Web Apps, GitHub Pages)

## Azure Setup Steps

### 1. App Registration
1. Go to Azure Portal > Azure Active Directory
2. Navigate to "App registrations" > "New registration"
3. Name: "ExamManager"
4. Supported account types: "Accounts in any organizational directory"
5. Redirect URI: Add your deployment URL (e.g., https://your-domain.com)
6. Click "Register"

### 2. Configure Authentication
1. In your app registration:
   - Go to "Authentication"
   - Add additional redirect URIs if needed
   - Enable "Access tokens" and "ID tokens"
   - Save changes

### 3. Add API Permissions
1. Go to "API permissions"
2. Add permissions:
   - Microsoft Graph > User.Read
   - Microsoft Graph > Group.Read.All
3. Click "Grant admin consent"

### 4. Create Admin Group
1. Go to Azure Active Directory > Groups
2. Create new security group: "ExamManager Admins"
3. Add admin users to this group
4. Copy the group's Object ID
5. Update `adminGroupId` in dashboard.html

## Deployment Steps

### Option 1: Azure Static Web Apps
1. Create new Static Web App in Azure Portal
2. Connect to your GitHub repository
3. Configure build settings:
   - Build Preset: Custom
   - App location: "/"
   - Output location: "/"
4. Update authentication settings in your code:
   ```javascript
   const msalConfig = {
       auth: {
           clientId: "YOUR_CLIENT_ID",
           authority: "https://login.microsoftonline.com/common",
           redirectUri: "https://your-static-web-app-url",
       }
   };
   ```

### Option 2: GitHub Pages
1. Enable GitHub Pages in your repository settings
2. Choose branch and folder for deployment
3. Update authentication settings with your GitHub Pages URL

## Testing Deployment
1. Visit your deployed URL
2. Test login functionality
3. Verify admin features work for admin users
4. Check exam data persistence
5. Test notifications

## Troubleshooting
- Check browser console for errors
- Verify redirect URIs are correctly configured
- Ensure all API permissions are granted
- Verify admin group ID is correct
- Check localStorage availability 