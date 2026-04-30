import Sidebar from './Sidebar';

const AdminLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-gray-900 text-white">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
