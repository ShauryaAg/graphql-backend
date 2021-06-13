const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLInt,
    GraphQLString,
    GraphQLList,
    GraphQLScalarType,
    GraphQLInputObjectType
} = require('graphql')

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        bio: { type: GraphQLString },
        profileImage: { type: GraphQLString },
        coverImage: { type: GraphQLString },
        events: { type: GraphQLList(EventType) }
    })
})

const EventType = new GraphQLObjectType({
    name: 'Event',
    fields: () => ({
        id: { type: GraphQLID },
        creator: { type: GraphQLID },
        title: { type: GraphQLString },
        price: { type: GraphQLInt },
        date: { type: GraphQLString },
        image: { type: GraphQLString },
        users: { type: GraphQLList(UserType) }
    })
})

// Input Types
const CreateUserInputType = new GraphQLInputObjectType({
    name: 'CreateUserInput',
    description: 'Input payload for creating user',
    fields: () => ({
        email: { type: GraphQLString },
        name: { type: GraphQLString },
        bio: { type: GraphQLString },
        profileImage: { type: GraphQLString },
        coverImage: { type: GraphQLString }
    })
})

const CreateEventInputType = new GraphQLInputObjectType({
    name: 'CreateEventInput',
    description: 'Input payload for creating event',
    fields: () => ({
        creator: { type: GraphQLID },
        title: { type: GraphQLString },
        price: { type: GraphQLInt },
        date: { type: GraphQLString },
        image: { type: GraphQLString }
    })
})

module.exports = { EventType, UserType, CreateUserInputType, CreateEventInputType }