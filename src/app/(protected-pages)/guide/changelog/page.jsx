import Container from '@/components/shared/Container'
import logData from '@/data/changelog.json'

const Log = (props) => {
    return (
        <div className={`py-4 ${props.border && 'border-bottom'}`}>
            <div className="flex items-center">
                <h5 className="font-weight-normal mb-0 mr-3">
                    {props.version}
                </h5>
                <code>{props.date}</code>
            </div>
            <div className="api-container p-0 border-0 mt-3">
                {props.children}
            </div>
        </div>
    )
}

const Page = () => {
    return (
        <Container>
            <div>
                <h4>Changelog</h4>
                {logData.map((elm) => (
                    <Log
                        key={elm.version}
                        version={`v${elm.version}`}
                        date={elm.date}
                    >
                        {elm.message ? (
                            <ul>
                                <li>
                                    - [{elm.type}] {elm.message}
                                </li>
                            </ul>
                        ) : null}
                    </Log>
                ))}
            </div>
        </Container>
    )
}

export default Page
