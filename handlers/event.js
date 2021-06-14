const firebase = require('firebase-admin')

const db = require('../firebase/firebase-db')

exports.getEventById = async (parent, args, req) => {
    const doc = await db.collection("events")
        .doc(args.id)
        .get()

    let eventUsers = await Promise.all(doc.data().users.map(async userId => {
        user = await db.doc(`users/${userId}`).get()
        return { id: user.id, ...user.data() }
    }))

    return { id: doc.id, ...doc.data(), users: eventUsers }
}

exports.getEvents = async (parent, args, req) => {
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

exports.createEvent = async (parent, args, req) => {
    // await auth(req)

    const newEventRef = db.collection("events").doc()
    await newEventRef.set(args.input)
    const newEvent = await newEventRef.get()

    await args.input.users.forEach(async userId => {
        user = await db.collection("users").doc(userId).get()
        if (user.exists) {
            await newEventRef.set({
                users: firebase.firestore.FieldValue.arrayUnion(user.id)
            }, { merge: true })
        }
    })

    let eventUsers = await Promise.all(newEvent.data().users.map(async userId => {
        user = await db.doc(`users/${userId}`).get()
        return { id: user.id, ...user.data() }
    }))

    return { id: newEvent.id, ...newEvent.data(), users: eventUsers }
}

exports.updateEvent = async (parent, args, req) => {
    // await auth(req)

    let eventRef = await db.collection("events").doc(args.id)
    let event = await eventRef.get()

    //check if event exists
    if (event.exists) {
        await eventRef.update(args._set)

        await args._set.users.forEach(async userId => {
            user = await db.collection("users").doc(userId).get()
            if (user.exists) {
                await eventRef.set({
                    users: firebase.firestore.FieldValue.arrayUnion(user.id)
                }, { merge: true })
            }
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

exports.deleteEvent = async (parent, args, req) => {
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