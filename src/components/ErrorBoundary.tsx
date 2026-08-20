import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-[#FDFBF7] text-center rounded-2xl border border-[#E5E1D5]">
          <div className="w-14 h-14 bg-[#FAF5F5] rounded-full flex items-center justify-center text-[#A34A4A] mb-4 border border-[#E8D0D0]">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-lg font-bold text-[#4A4A3A] mb-2">畫面載入時發生非預期錯誤</h2>
          <p className="text-sm text-[#8A8475] max-w-md mb-4 font-mono bg-white p-3 rounded-lg border border-[#E5E1D5] break-words">
            {this.state.error?.message || '未知錯誤'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#5A5A40] text-white text-sm font-medium rounded-lg hover:bg-[#4A4A35] transition-colors shadow-sm"
          >
            <RefreshCw size={16} /> 重新整理頁面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
