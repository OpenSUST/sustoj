/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { createContext, useContext } from 'react'

export const Context = createContext(0)

export default () => useContext(Context)
