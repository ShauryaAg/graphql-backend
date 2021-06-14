const firebase = require('firebase-admin')

const db = require("../../../firebase/firebase-db")
const auth = require('../../../middleware/graphql/auth')

const { EventType, UserType, CreateUserInputType, CreateEventInputType } = require('./types')

const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLInt,
    GraphQLString,
    GraphQLBoolean,
    GraphQLList,
    GraphQLSchema,
    GraphQLNonNull,
    GraphQLScalarType,
    GraphQLInputObjectType,
} = require('graphql')



const RootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        eventById: {
            type: EventType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args) {
                const res = await db.collection("events")
                    .doc(args.id)
                    .get()
                return { id: res.id, ...res.data() }
            }
        },
        listEvents: {
            type: new GraphQLList(EventType),
            async resolve(parent, args) {

                const querySnapshot = await db.collection("events").get()
                allEvents = await Promise.all(
                    querySnapshot.docs.map(async (doc) => {
                        let eventUsers = await Promise.all(doc.data().users.map(async userId => {
                            user = await db.doc(`users/${userId}`).get()
                            return { id: user.id, ...user.data() }
                        }))

                        return { id: doc.id, ...doc.data(), users: eventUsers }
                    })
                )

                return allEvents
            }
        },
        userById: {
            type: UserType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args) {
                const res = await db.collection("users")
                    .doc(args.id)
                    .get()
                return { id: res.id, ...res.data() }
            }
        },
        listUsers: {
            type: new GraphQLList(UserType),
            async resolve(parent, args) {
                const querySnapshot = await db.collection("users")
                    .get()
                allUsers = []
                querySnapshot.forEach((doc) => {
                    allUsers.push({
                        id: doc.id,
                        ...doc.data()
                    })
                })
                return allUsers
            }
        },
    }
})

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        createUser: {
            type: UserType,
            args: {
                input: { type: new GraphQLNonNull(CreateUserInputType) },
            },
            async resolve(parent, args, req) {
                const newUserRef = db.collection("users").doc()
                await newUserRef.set(args.input)
                const newUser = await newUserRef.get()

                return { id: newUser.id, ...newUser.data() }
            }
        },
        updateUser: {
            type: UserType,
            args: {
                id: { type: GraphQLID },
                _set: { type: new GraphQLNonNull(CreateUserInputType) },
            },
            async resolve(parent, args, req) {
                await auth(req)

                let userRef = await db.collection("users").doc(args.id)
                let user = await userRef.get()

                //check if user exists
                if (user.exists) {
                    if (user.data().creator == req.decoded) {
                        await userRef.update(args._set)
                        user = await userRef.get()
                        return { id: user.id, ...user.data() }
                    }
                } else {
                    //can't update
                    throw new Error("can't update user")
                }
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args, req) {
                await auth(req)

                let userRef = await db.collection("users").doc(args.id)
                let user = await userRef.get()

                //check if user exists
                if (user.exists) {
                    if (user.data().creator == req.decoded) {
                        await userRef.delete()
                        user = await userRef.get()
                        return { id: user.id, ...user.data() }
                    }
                } else {
                    //can't delete
                    throw new Error("can't delete user")
                }
            }
        },
        createEvent: {
            type: EventType,
            args: {
                input: { type: new GraphQLNonNull(CreateEventInputType) },
            },
            async resolve(parent, args, req) {
                // await auth(req)

                const newEventRef = db.collection("events").doc()
                await newEventRef.set(args.input)

                const newEvent = await newEventRef.get()

                await args.input.users.forEach(async userId => {
                    userRef = await db.collection("users").doc(userId)
                    user = await userRef.get()
                    if (user.exists) {
                        await newEventRef.set({
                            users: firebase.firestore.FieldValue.arrayUnion(userRef)
                        }, { merge: true })
                    }
                })


                let eventUsers = await Promise.all(newEvent.data().users.map(async userId => {
                    user = await db.doc(`users/${userId}`).get()
                    return { id: user.id, ...user.data() }
                }))

                return { id: newEvent.id, ...newEvent.data(), users: eventUsers }
            }
        },
        updateEvent: {
            type: EventType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                _set: { type: new GraphQLNonNull(CreateEventInputType) },
            },
            async resolve(parent, args, req) {
                // await auth(req)

                let eventRef = await db.collection("events").doc(args.id)
                let event = await eventRef.get()

                //check if event exists
                if (event.exists) {
                    await eventRef.update(args._set)

                    await args._set.users.map(async userId => {
                        userRef = await db.doc(`users/${userId}`)
                        await eventRef.update({
                            users: firebase.firestore.FieldValue.arrayUnion(userRef)
                        }, { merge: true })
                    })

                    let eventUsers = await Promise.all(event.data().users.map(async userId => {
                        user = await db.doc(`users/${userId}`).get()
                        return { id: user.id, ...user.data() }
                    }))

                    return { id: event.id, ...event.data(), users: eventUsers }
                } else {
                    //can't update
                    throw new Error("can't update event")
                }
            }
        },
        deleteEvent: {
            type: EventType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args, req) {
                await auth(req)

                let eventRef = await db.collection("events").doc(args.id)
                let event = await eventRef.get()

                //check if event exists
                if (event.exists) {
                    //check if current user is the creator
                    if (event.data().creator == req.decoded) {
                        await eventRef.delete()
                        event = await eventRef.get()
                        return { id: event.id, ...event.data() }
                    }
                } else {
                    //can't delete
                    throw new Error("can't update event")
                }
            }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
})