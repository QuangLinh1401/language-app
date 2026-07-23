import { Component } from "react";

// Catches render-time crashes so the user gets a retry screen instead of a
// silent white page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ margin: 20, textAlign: "center", padding: "28px 16px" }}>
          <div style={{ fontSize: 32 }}>😵</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 16, margin: "10px 0 4px", color: "var(--teal-deep)" }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 16 }}>
            Đừng lo — tiến độ của bạn đã được lưu trên máy chủ.
          </div>
          <button className="btn-primary" onClick={() => window.location.reload()}>Tải lại app</button>
        </div>
      );
    }
    return this.props.children;
  }
}
