import React from 'react'
import Modal from 'react-modal'
import styled from 'styled-components'
import { useTable } from 'react-table'
import { Game } from './types'

type Props = {
    isOpen: boolean
    onRequestClose: (event: React.MouseEvent) => void
    game: Game
}
type State = {}

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
}

const data = [{}]

class Results extends React.Component<Props, State> {
    render() {
        const { isOpen, onRequestClose, game } = this.props

        return (
            <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
                <ResultsTable game={game} />
            </Modal>
        )
    }
}

export default Results

const Styles = styled.div`
    padding: 1rem;

    table {
        border-spacing: 0;
        border: 1px solid black;

        tr {
            :last-child {
                td {
                    border-bottom: 0;
                }
            }
        }

        th,
        td {
            margin: 0;
            padding: 0.5rem;
            border-bottom: 1px solid black;
            border-right: 1px solid black;

            :last-child {
                border-right: 0;
            }
        }
    }
`

function Table({ columns, data }: { columns: any; data: any }) {
    // Use the state and functions returned from useTable to build your UI
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
        columns,
        data,
    })

    // Render the UI for your table
    return (
        <table {...getTableProps()}>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map((row, i) => {
                    prepareRow(row)
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map((cell) => {
                                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

type ResultsTableProps = {
    game: Game
}

function ResultsTable(props: ResultsTableProps) {
    const { game } = props
    const { users } = game

    const accumulator = users.reduce((a, c) => ({ ...a, [`points${c.id}`]: 0 }), { round: 'total' })

    const userTotals = game.rounds.reduce(
        (a, c) => ({
            ...a,
            ...c.results.reduce((acc: any, cur) => {
                const points = acc[`points${cur.userId}`] + cur.points
                return { ...acc, [`points${cur.userId}`]: points }
            }, a),
        }),
        accumulator,
    )

    const data = game.rounds.map((r) => {
        const ret: any = { round: r.id }
        const userResults = r.results.map((result) => ({
            [`bid${result.userId}`]: result.bid,
            [`points${result.userId}`]: result.points,
        }))
        userResults.forEach((result) => Object.keys(result).map((key) => (ret[key] = result[key])))
        return ret
    })
    // add totals
    const total: { [x: string]: any } = { round: 'total' }
    Object.keys(userTotals).map((key: string) => {
        // @ts-ignore
        total[key] = userTotals[key]
    })
    data.push(total)

    const columns = React.useMemo(
        () => [
            {
                Header: '',
                accessor: 'rounds',
                columns: [
                    {
                        Header: 'Round',
                        accessor: 'round',
                    },
                ],
            },
            {
                Header: 'Players',
                accessor: 'players',
                columns: users.map((user) => ({
                    Header: user.name,
                    accessor: user.id.toString(),
                    columns: [
                        {
                            Header: 'Bid',
                            accessor: `bid${user.id}`,
                        },
                        {
                            Header: 'Points',
                            accessor: `points${user.id}`,
                        },
                    ],
                })),
            },
        ],
        [],
    )

    return (
        <Styles>
            <Table columns={columns} data={data} />
        </Styles>
    )
}
