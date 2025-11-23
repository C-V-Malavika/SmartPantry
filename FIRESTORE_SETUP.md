# Firestore Security Rules Setup

If you're getting "Failed to add ingredient to database" errors, it's likely due to Firestore security rules blocking writes.

## How to Fix Firestore Security Rules

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `recipe-fsd`

2. **Navigate to Firestore Database**
   - Click on "Firestore Database" in the left sidebar
   - Click on the "Rules" tab

3. **Update Security Rules**

   Replace your current rules with these (allows read/write for development):

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write access to Ingredients collection
       match /Ingredients/{document=**} {
         allow read, write: if true;
       }
       
       // Allow read/write access to Food collection
       match /Food/{document=**} {
         allow read, write: if true;
       }
       
       // Deny all other access
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

4. **Publish the Rules**
   - Click "Publish" button
   - Wait for confirmation

## For Production (More Secure Rules)

If you want more secure rules for production, you can use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
     // Allow read access to all authenticated users
     // Allow write access only to authenticated users
     match /Ingredients/{document=**} {
       allow read: if request.auth != null;
       allow write: if request.auth != null;
     }
     
     match /Food/{document=**} {
       allow read: if request.auth != null;
       allow write: if request.auth != null;
     }
   }
}
```

## Testing

After updating the rules:
1. Refresh your browser
2. Try adding an ingredient again
3. Check the browser console for any error messages
4. The form will now show a Firestore test result when it loads

## Common Issues

- **Permission Denied**: Security rules are blocking access
- **Unavailable**: Check your internet connection
- **Invalid API Key**: Verify your Firebase config in `frontend/src/firebase.js`

