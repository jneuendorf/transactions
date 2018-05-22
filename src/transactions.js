const registry = new Map()


export const register = (up, down, {bidirectional=false, name=null}={}) => {
    registry.set(up, {
        inverse: down,
        name: name || `${up.name}-${down.name}`,
    })

    if (bidirectional) {
        registry.set(down, {
            inverse: up,
            name: `${name || `${down.name}-${up.name}`}Inverse`,
        })
    }
}

export const clearRegistry = () => {
    registry.clear()
}

export const transaction = async (...tasks) => {
    for (const task of tasks) {
        if (!registry.has(task)) {
            const i = tasks.indexOf(task) + 1
            throw new Error(
                `Could not find inverse for ${i}. task. `
                + `Code: ${task}`
            )
        }
    }

    const completedOperations = []
    for (const task of tasks) {
        try {
            await task()
            completedOperations.push(task)
        }
        catch (error) {
            console.debug('rolling back because:', error.message)
            const inverses = (
                completedOperations
                .map(task => registry.get(task).inverse)
                .reverse()
            )
            for (const inverse of inverses) {
                await inverse()
            }
            break
        }
    }
    return async () => {
        const inverses = (
            tasks
            .map(task => registry.get(task).inverse)
            .reverse()
        )
        for (const inverse of inverses) {
            await inverse()
        }
    }
}


export default transaction
