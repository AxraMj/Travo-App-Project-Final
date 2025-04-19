AWS for react project

AWS Amplify CLI (Command Line Interface)

(LinkedIn Learning course)
Install CLI


The AWS Amplify CLI is a command-line tool that helps developers build, configure, and deploy full-stack applications using AWS services.

AWS for Developers: Amplify Studio 
This is a LinkedIn Learning course that teaches you how to use AWS Amplify Studio, a visual development environment for building web apps quickly using AWS.

in this project we will 
install CLI
and configure with aws account key

for setting up Amplify CLI
Refer: https://docs.amplify.aws/react/start/manual-installation/
npm install -g @aws-amplify/cli

to config run
amplify configure
Successfully set up the new user.

---------------------------------------------------------------------------------------------------
Now lets setup
Fist initialize the AWS project
amplify init

THis will provide AWS services like CloudeFormation,cloudWatch,IAM Etc..
then after services,
Add hosting via Amplify CLI: amplify add hosting
then,
Publish to S3 bucket: amplify publish(publish the hosting)
then,view in browser

PS F:\Linkedin AWS and React Creating Full-Stack Apps\todo> amplify status

    Current Environment: dev

┌──────────┬─────────────────┬───────────┬───────────────────┐
│ Category │ Resource name   │ Operation │ Provider plugin   │
├──────────┼─────────────────┼───────────┼───────────────────┤
│ Hosting  │ S3AndCloudFront │ Create    │ awscloudformation │
└──────────┴─────────────────┴───────────┴───────────────────┘

steps
amplify  init
amplify add hosting (choose:  amplify add hosting)
amplify status
amplify publish

after publishing we will get a link which will drect us to our todo app itself