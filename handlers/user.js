const firebase = require('firebase-admin')

const db = require('../firebase/firebase-db')

exports.getUserById = async (parent, args, req) => {
    const doc = await db.collection("users")
        .doc(args.id)
        .get()

    let userEvents = await Promise.all(doc.data().events.map(async eventId => {
        let event = await db.doc(`events/${eventId}`).get()
        return { id: event.id, ...event.data() }
    }))

    return { id: doc.id, ...doc.data(), events: userEvents }
}


exports.getUsers = async (parent, args, req) => {
    const querySnapshot = await db.collection("users")
        .get()

    allUsers = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
            let userEvents = await Promise.all(doc.data().events.map(async eventId => {
                let event = await db.doc(`users/${eventId}`).get()
                return { id: event.id, ...event.data() }
            }))

            return { id: doc.id, ...doc.data(), events: userEvents }
        })
    )

    return allUsers
}

exports.createUser = async (parent, args, req) => {
    const newUserRef = db.collection("users").doc()
    await newUserRef.set(args.input)
    const newUser = await newUserRef.get()

    return { id: newUser.id, ...newUser.data() }
}

exports.updateUser = async (parent, args, req) => {
    await auth(req)

    let userRef = db.collection("users").doc(args.id)
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

exports.deleteUser = async (parent, args, req) => {
    await auth(req)

    let userRef = db.collection("users").doc(args.id)
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