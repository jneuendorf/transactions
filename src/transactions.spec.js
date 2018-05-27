const {register, clearRegistry, transaction} = require('./transactions')


let state, incrementA, decrementA, createPropB, deletePropB
const initialState = {a: 1}

describe('transactions', () => {
    beforeEach(() => {
        state = {...initialState}
        incrementA = () => {
            state.a += 1
        }
        decrementA = () => {
            state.a -= 1
        }
        createPropB = () => {
            state.b = true
        }
        deletePropB = () => {
            delete state.b
        }

        register(incrementA, decrementA)
        register(createPropB, deletePropB)
    })

    afterEach(() => {
        clearRegistry()
    })

    test('tasks w/o errors', async () => {
        await transaction(
            incrementA,
            createPropB,
        )
        expect(state).toEqual({a: 2, b: true})
    })

    test('tasks w/ errors (automatic rollback)', async () => {
        const errorMessage = 'Some error.'
        createPropB = () => {
            throw new Error(errorMessage)
        }
        register(createPropB, deletePropB)
        const reason = await transaction(
            incrementA,
            createPropB,
        )
        expect(reason).toBeInstanceOf(Error)
        expect(reason.message).toBe(errorMessage)
        expect(state).toEqual(initialState)
    })

    test('manual rollback', async () => {
        const rollback = await transaction(
            incrementA,
            createPropB,
        )
        expect(rollback).toBeInstanceOf(Function)
        await rollback()
        expect(state).toEqual(initialState)
    })

    test('error while rollback (manual state restore)', async () => {
        deletePropB = () => {
            throw new Error(`That's gonna be fatal.`)
        }
        register(createPropB, deletePropB)
        const error = () => {
            throw new Error('Some error.')
        }
        let errorInverseWasCalled = false
        register(
            error,
            () => {
                errorInverseWasCalled = true
            }
        )
        await expect(transaction(
            incrementA,
            createPropB,
            error,
        )).rejects.toThrow('fatal')
        expect(errorInverseWasCalled).toBe(false)
    })

    test('using unregistered task', async () => {
        clearRegistry()
        await expect(transaction(
            incrementA,
            createPropB,
        )).rejects.toThrow('Could not find inverse for 1. task.')
    })

    test('using unregistered task', async () => {
        await expect(transaction(
            decrementA,
        )).rejects.toThrow('Could not find inverse for 1. task.')
        register(incrementA, decrementA, {bidirectional: true})
        await transaction(decrementA)
        expect(state).toEqual({a: 0})
    })
})
