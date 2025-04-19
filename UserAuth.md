User authentiaction(The ability for users to create account and login with those account)
So we use AWS service for database
so, to get in the AWS Services, we need the user to create their account and login 
The service we're going to use for that is called Cognito
The Cognito identity pool has Two rules:Unauthenticated and authenticated

for that
we run this on commant line

amplify add auth
configuration walk through
amplify push
Cognito (to hadle authentication)

after this setup in AWS we need to install amplify package in mpm
____________________________________________
npm install needed amplify package- npm install @aws-amplify/ui-react aws-amplify
import amplify,ui and aws-exports
configure amplify with aws-exports
user authentication
