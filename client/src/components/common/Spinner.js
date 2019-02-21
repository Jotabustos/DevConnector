import React from 'react'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'

library.add(faSpinner)



const Spinner = () => {
  return (
      <FontAwesomeIcon icon="spinner" style={{ margin: 'auto', display: 'block' }} spin size='3x'/>
  )
}

export default Spinner;