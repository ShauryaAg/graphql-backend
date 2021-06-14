const {
    GraphQLID,
    GraphQLList,
    GraphQLSchema,
    GraphQLNonNull,
    GraphQLObjectType,
} = require('graphql')

const handlers = require('../../../handlers')
const { EventType, UserType,
    CreateUserInputType, CreateEventInputType } = require('./types')

const RootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        eventById: {
            type: EventType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args) { return handlers.getEventById(parent, args) }
        },
        listEvents: {
            type: new GraphQLList(EventType),
            async resolve(parent, args) { return handlers.getEvents(parent, args, req) }
        },
        userById: {
            type: UserType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args) { return handlers.getUserById(parent, args, req) }
        },
        listUsers: {
            type: new GraphQLList(UserType),
            async resolve(parent, args) { return handlers.getUsers(parent, args, req) }
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
            async resolve(parent, args, req) { return handlers.createUser(parent, args, req) }
        },
        updateUser: {
            type: UserType,
            args: {
                id: { type: GraphQLID },
                _set: { type: new GraphQLNonNull(CreateUserInputType) },
            },
            async resolve(parent, args, req) { return handlers.updateUser(parent, args, req) }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args, req) { return handlers.deleteUser(parent, args, req) }
        },
        createEvent: {
            type: EventType,
            args: {
                input: { type: new GraphQLNonNull(CreateEventInputType) },
            },
            async resolve(parent, args, req) { return handlers.createEvent(parent, args, req) }
        },
        updateEvent: {
            type: EventType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                _set: { type: new GraphQLNonNull(CreateEventInputType) },
            },
            async resolve(parent, args, req) { return handlers.updateEvent(parent, args, req) }
        },
        deleteEvent: {
            type: EventType,
            args: {
                id: { type: GraphQLID }
            },
            async resolve(parent, args, req) { return handlers.deleteEvent(parent, args, req) }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
})