import { useMailStore } from '../_store/mailStore'
import cloneDeep from 'lodash/cloneDeep'

const useMailAction = () => {
    const { mailList, setMail, setMailList, setSelectedMail } = useMailStore()

    const updateMailList = (newMail) => {
        const newMailList = cloneDeep(mailList).map((mail) => {
            if (mail.id === newMail.id) {
                mail = newMail
            }
            return mail
        })
        setMailList(newMailList)
    }

    const persistUpdate = async (id, data) => {
        try {
            await fetch(`/api/mail/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
        } catch (err) {
            console.error('Failed to update mail:', err)
        }
    }

    const onStarToggle = (mail, shouldSetMail = true) => {
        const newMail = cloneDeep(mail)
        newMail.starred = !newMail.starred
        if (shouldSetMail) {
            setMail(newMail)
        }
        updateMailList(newMail)
        persistUpdate(mail.id, { starred: newMail.starred })
    }

    const onFlagToggle = (mail, shouldSetMail = true) => {
        const newMail = cloneDeep(mail)
        newMail.flagged = !newMail.flagged
        if (shouldSetMail) {
            setMail(newMail)
        }
        updateMailList(newMail)
        persistUpdate(mail.id, { flagged: newMail.flagged })
    }

    const onCheckboxToggle = (mail) => {
        const newMail = cloneDeep(mail)
        newMail.checked = !newMail.checked
        updateMailList(newMail)
    }

    const onMoveMailClick = (mail, destination) => {
        const newMail = cloneDeep(mail)
        newMail.label = destination
        updateMailList(newMail)
        persistUpdate(mail.id, { label: destination })
    }

    const onBatchMoveMailClick = (mailsId, destination) => {
        setMailList(
            mailList.map((mail) => {
                if (mailsId.includes(mail.id)) {
                    mail.label = destination
                    mail.checked = false
                    persistUpdate(mail.id, { label: destination })
                }
                return mail
            }),
        )
        setSelectedMail([])
    }

    const onMailDelete = async (mailsId) => {
        // Separate mails already in deleted folder from others
        const toHardDelete = mailList.filter((m) => mailsId.includes(m.id) && m.group === 'deleted')
        const toSoftDelete = mailList.filter((m) => mailsId.includes(m.id) && m.group !== 'deleted')

        // Remove all from UI
        setMailList(mailList.filter((mail) => !mailsId.includes(mail.id)))
        setSelectedMail([])

        // Hard-delete mails already in Deleted folder
        for (const mail of toHardDelete) {
            try {
                await fetch(`/api/mail/${mail.id}`, { method: 'DELETE' })
            } catch (err) {
                console.error('Failed to hard-delete mail:', err)
            }
        }

        // Move others to deleted folder
        for (const mail of toSoftDelete) {
            persistUpdate(mail.id, { group: 'deleted' })
        }
    }

    const onResetChecked = () => {
        setMailList(
            mailList.map((mail) => {
                mail.checked = false
                return mail
            }),
        )
        setSelectedMail([])
    }

    return {
        onStarToggle,
        onMailDelete,
        onFlagToggle,
        onMoveMailClick,
        onCheckboxToggle,
        onResetChecked,
        onBatchMoveMailClick,
    }
}

export default useMailAction
