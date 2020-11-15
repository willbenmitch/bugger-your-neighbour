import { Sequelize } from 'sequelize-typescript'
import * as models from './models'

const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB } = process.env

const sequelize = new Sequelize(`postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`, {
    models: [__dirname + '/models/**/*.model.ts'],
    benchmark: true,
    // logging(sql: string, durationMs: number) {
    //     /**
    //      * TODO: Tracking database runtime with RequestContext is currenty
    //      * inconsistent and buggy. We may have to wait until we're on
    //      * Sequelize v6 and/or for better async hooks stability.
    //      *
    //      * Fire two requests in quick succession and you'll find that the
    //      * db runtime for the second request is undefined and sometimes
    //      * attached to the first request's context as if that context were
    //      * sticking around after it had finished (ie. still active/current
    //      * durring second request).
    //      */
    //     console.warn(sql, { durationMs })
    // },
    logging: false,
})

export const db = { sequelize, ...models }
