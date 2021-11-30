import styled from '@emotion/styled'

import { Stack } from '@mui/material'
import useAxios from 'axios-hooks'
import { FC, useEffect, useRef, useState } from 'react'

import { SearchInput } from '../../atoms/SearchInput'
import { QuickSearchResult } from '../../molecules/QuickSearchResult'

interface QuickSearchProps {
    setSearchOpen: Function
}

const QuickSearchWrapper = styled(Stack)`
    display: block;
`

const StyledBackground = styled.div<{ open: boolean }>`
    opacity: ${(props) => (props.open ? '0.5' : '0')};
    height: ${(props) => (props.open ? '100vh' : '0')} !important;

    transition: opacity 0.3s;

    height: 100vh;
    width: 100vw;
    top: 0;
    left: 0;
    background-color: #000000;
    position: absolute;
    margin: 0 !important;
`

export const QuickSearch: FC<QuickSearchProps> = ({ ...props }) => {
    const inputRef = useRef<HTMLInputElement>(null)

    const [openSearchResult, setOpenSearchresult] = useState(false)

    const [loading, setLoading] = useState(false)
    const [inputValue, setInputValue] = useState('')

    const [searchResponse, getSearch] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts/search`,
            method: 'GET',
            withCredentials: true,
        },
        { manual: true },
    )

    useEffect(() => {
        if (inputValue.length >= 2) {
            const delaySearch = setTimeout(() => {
                setLoading(false)
                getSearch({
                    params: {
                        searchString: inputValue
                    }
                })
            }, 800)

            return () => {
                clearTimeout(delaySearch)
            }
        } else {
            setLoading(false)
        }
    }, [inputValue])

    const handleChange = () => {
        setInputValue(inputRef.current?.value as string)

        if (inputValue.length >= 1) {
            setLoading(true)
        }
    }

    const handleCloseInput = () => {
        setOpenSearchresult(false)

        if (inputRef.current?.value) {
            inputRef.current.value = ''
        }
        inputRef?.current?.blur()

        setTimeout(() => {
            props.setSearchOpen(false)
        }, 300)
        setInputValue('')
    }

    return (
        <>
            <StyledBackground
                open={openSearchResult}
                onClick={() => handleCloseInput()}
            ></StyledBackground>
            <QuickSearchWrapper
                direction="column"
                onClick={() => {
                    props.setSearchOpen(true)
                }}
            >
                <SearchInput
                    open={openSearchResult}
                    ref={inputRef}
                    onChange={handleChange}
                    onFocus={() => {
                        inputRef?.current?.focus()
                        setTimeout(() => setOpenSearchresult(true), 200)
                        props.setSearchOpen(true)
                    }}
                />
                <QuickSearchResult
                    loading={loading || searchResponse.loading}
                    open={openSearchResult}
                    closeResult={handleCloseInput}
                    profilesSearchResult={[]}
                    error={searchResponse.error ? true : false}
                    artworksSearchResult={searchResponse.data?.nfts ?? []}
                    categoriesSearchResult={searchResponse.data?.categories ?? []}
                    searchString={inputRef.current?.value}
                />
            </QuickSearchWrapper>
        </>
    )
}