export function LoadingPage() {
    return (
        <div className="h-screen flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">
                    กำลังโหลดข้อมูล...
                </p>
            </div>
        </div>
    )
}