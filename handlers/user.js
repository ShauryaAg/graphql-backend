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

    await args.input.events.forEach(async eventId => {
        let event = await db.collection("users").doc(eventId).get()
        if (event.exists) {
            await newUserRef.set({
                event: firebase.firestore.FieldValue.arrayUnion(event.id)
            }, { merge: true })
        }
    })

    let userEvents = await Promise.all(newUser.data().users.map(async eventId => {
        let event = await db.doc(`events/${eventId}`).get()
        return { id: event.id, ...event.data() }
    }))

    return { id: newUser.id, ...newUser.data(), users: userEvents }
}

exports.updateUser = async (parent, args, req) => {
    await auth(req)

    let userRef = db.collection("users").doc(args.id)
    let user = await userRef.get()

    //check if user exists
    if (user.exists) {
        if (user.data().creator == req.decoded) {
            await userRef.update(args._set)

            await args._set.events.forEach(async eventId => {
                let event = await db.collection("events").doc(eventId).get()
                if (event.exists) {
                    await eventRef.set({
                        events: firebase.firestore.FieldValue.arrayUnion(event.id)
                    }, { merge: true })
                }
            })

            let userEvents = await Promise.all(user.data().events.map(async eventId => {
                let event = await db.doc(`events/${eventId}`).get()
                return { id: event.id, ...event.data() }
            }))

            return { id: user.id, ...user.data(), events: userEvents }
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