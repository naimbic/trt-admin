import { create } from 'zustand'

const useProfileStore = create((set) => ({
    name: null,
    image: null,
    email: null,
    setProfile: ({ name, image, email }) =>
        set({ name, image, email }),
}))

export default useProfileStore
