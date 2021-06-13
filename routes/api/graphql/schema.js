const db = require("../../../firebase/firebase-db");
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
                    .get();
                return res.data();
            }
        },
        listEvents: {
            type: new GraphQLList(EventType),
            async resolve(parent, args) {
                const querySnapshot = await db.collection("events")
                    .get();
                allEvents = [];
                querySnapshot.forEach((doc) => {
                    allEvents.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                return allEvents;
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
                    .get();
                return res.data();
            }
        },
        listUsers: {
            type: new GraphQLList(UserType),
            async resolve(parent, args) {
                const querySnapshot = await db.collection("users")
                    .get();
                allUsers = [];
                querySnapshot.forEach((doc) => {
                    allUsers.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                return allUsers;
            }
        },
    }
})

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        createEvent: {
            type: EventType,
            args: {
                input: { type: new GraphQLNonNull(CreateEventInputType) },
            },
            async resolve(parent, args, req) {
                // await auth(req)

                const eventData = {
                    title: args.input.title,
                    price: args.input.price,
                    date: args.input.date,
                    image: args.input.image ?? null,
                    creator: req.decoded ?? null
                }

                const newEventRef = db.collection("events").doc();
                await newEventRef.set(eventData);

                const newEvent = await newEventRef.get();

                // const userRef = db.collection("users").doc(req.decoded);
                // userRef.set({
                //     events: [`/events/${newEvent.id}`]
                // }, { merge: true })

                return { id: newEvent.id, ...newEvent.data() }
            }
        },
        updateEvent: {
            type: EventType,
            args: {
                id: { type: GraphQLNonNull(GraphQLID) },
                _set: { type: new GraphQLNonNull(CreateEventInputType) },
            },
            async resolve(parent, args, req) {
                // await auth(req)

                let eventRef = await db.collection("events").doc(args.id).get();
                let event = await eventRef.get();

                //check if event exists
                if (event.exists) {
                    //check if current user is the creator
                    if (event.data().creator == req.decoded) {
                        await eventRef.update(args._set);
                        event = await eventRef.get();
                        return { id: event.id, ...event.data() }
                    }
                } else {
                    //can't update
                    throw new Error("can't update event");
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

                let eventId = args.id
                let eventRef = await db.collection("events").doc(eventId);
                let event = await eventRef.get();

                let userId
                try {
                    userId = req.headers.authorization.split('Bearer ')[1]
                } catch (err) {
                    console.log(`User not set Error: ${err}`)
                }

                //check if event exists
                if (event.exists) {
                    //check if current user is the creator
                    if (event.data().creator == userId) {
                        await eventRef.delete();
                        event = await eventRef.get();
                        return event.data()
                    }
                } else {
                    //can't update
                    throw new Error("can't update event");
                }
            }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});