/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { createContext, useContext } from 'react'

export const Context = createContext<string>(null)

export default () => useContext(Context)
