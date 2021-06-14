# GraphQL Backend

Since, I did not have AWS Services available to me at the moment, I opted to write a GraphQL API in Node.js to showcase my skills.

The API consists of only two user models:

- User
- Events

I went with firebase for the database, as the assignment stated to use DynamoDB (which I couldn't), and firebase is somewhat similar to DynamoDB.

The API has a many-to-many relation between User and Event, with reference to each instance stored in the model, however the same can also be achieved by using an intermediate table for many-to-many relations.

## Todo:

> > Things that couldn't be done due to time constraint. I could only start last night to work on this after confirming with the team if submitting a GraphQL API would be alright.

- [] Add proper authentication for user
- [] Add frontend in Next.js
