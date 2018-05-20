// 'use babel'


const registry = new Map()


class Transactions {
    static register(forward, backward, name=null) {
        if (!name) {
            name = forward.name || forward.toString()
        }
        registry.set(forward, {inverse: backward, name})
        console.log(name)
    }

    static async transaction(...operations) {
        for (const operation of operations) {
            if (!registry.has(operation)) {
                const i = operations.indexOf(operation) + 1
                throw new Error(
                    `Could not find inverse for ${i}th operation. `
                    + `Code: ${operation}`
                )
            }
        }

        const completedOperations = []
        for (const operation of operations) {
            try {
                await operation()
                completedOperations.push(operation)
            }
            catch (error) {
                console.log('rolling back because', error.message)
                completedOperations.reverse().forEach(operation =>
                    // Errors during rollback are fatal!
                    this.invert(operation)
                )
                break
            }
        }
    }

    static invert(operation) {
        registry.get(operation).inverse()
    }
}


module.exports = Transactions


const state = {
    a: 1,
    b: 2,
}
const operation1 = () => {
    state.a += 1
}
const operation1Inverse = () => {
    state.a -= 1
}
const operation2 = () => {
    throw new Error('some reason')
    state.b += 5
}
const operation2Inverse = () => {
    state.b -= 5
}

Transactions.register(operation1, operation1Inverse)
Transactions.register(operation2, operation2Inverse)


Transactions.transaction(
    operation1,
    operation2,
).then(() => {
    console.log(state)
})
