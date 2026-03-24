'use client'
import { useState, useEffect, useCallback } from 'react'
import Container from '@/components/shared/Container'
import Loading from '@/components/shared/Loading'
import Badge from '@/components/ui/Badge'
import Segment from '@/components/ui/Segment'
import Pagination from '@/components/ui/Pagination'

const typeColor = {
    feature: 'bg-emerald-500',
    fix: 'bg-red-500',
    update: 'bg-blue-500',
    breaking: 'bg-amber-500',
}

const PAGE_SIZE = 20

const Log = ({ version, date, type, children }) => (
    <div className="py-4">
        <div className="flex items-center gap-3">
            <h5 className="font-weight-normal mb-0">{version}</h5>
            <code>{date}</code>
            {type && (
                <Badge className={typeColor[type] || 'bg-gray-400'} content={type} />
            )}
        </div>
        <div className="mt-3">{children}</div>
    </div>
)

const Page = () => {
    const [project, setProject] = useState('backend')
    const [entries, setEntries] = useState([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(() => {
        setLoading(true)
        fetch(`/api/changelog?project=${project}&page=${page}&limit=${PAGE_SIZE}`)
            .then((r) => r.json())
            .then((res) => {
                setEntries(Array.isArray(res.data) ? res.data : [])
                setTotal(res.total || 0)
            })
            .catch(() => { setEntries([]); setTotal(0) })
            .finally(() => setLoading(false))
    }, [project, page])

    useEffect(() => { fetchData() }, [fetchData])

    const handleProjectChange = (val) => {
        const v = Array.isArray(val) ? val[0] : val
        if (v) {
            setProject(v)
            setPage(1)
        }
    }

    return (
        <Container>
            <div className="flex items-center justify-between mb-6">
                <h4>Changelog</h4>
                <Segment
                    size="sm"
                    value={[project]}
                    onChange={handleProjectChange}
                >
                    <Segment.Item value="backend">Backend</Segment.Item>
                    <Segment.Item value="frontend">Frontend</Segment.Item>
                </Segment>
            </div>
            <Loading loading={loading}>
                {entries.length === 0 && !loading && (
                    <p className="text-gray-400">No changelog entries for {project}.</p>
                )}
                {entries.map((elm) => (
                    <Log
                        key={elm.id}
                        version={`v${elm.version || '0.0.0'}`}
                        date={elm.date ? new Date(elm.date).toLocaleDateString('en') : ''}
                        type={elm.type}
                    >
                        {elm.message && (
                            <ul>
                                <li>- {elm.message}</li>
                            </ul>
                        )}
                        {elm.files?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {elm.files.map((f) => (
                                    <code key={f} className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                        {f}
                                    </code>
                                ))}
                            </div>
                        )}
                    </Log>
                ))}
            </Loading>
            {total > PAGE_SIZE && (
                <div className="flex justify-end mt-4">
                    <Pagination
                        total={total}
                        currentPage={page}
                        pageSize={PAGE_SIZE}
                        onChange={(p) => setPage(p)}
                    />
                </div>
            )}
        </Container>
    )
}

export default Page
