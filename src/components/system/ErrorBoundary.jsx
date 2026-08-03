import { Component } from 'react'
import ServerError from '../../pages/System/ServerError'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <ServerError onRetry={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}
