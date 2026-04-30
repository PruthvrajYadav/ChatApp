import React from 'react'

const Skeleton = ({ className }) => {
    return (
        <div className={`animate-pulse bg-white/5 rounded-lg ${className}`}></div>
    )
}

export const SidebarSkeleton = () => {
    return (
        <div className='flex flex-col gap-4 p-4'>
            {[...Array(8)].map((_, i) => (
                <div key={i} className='flex items-center gap-3'>
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className='flex-1 space-y-2'>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export const ChatSkeleton = () => {
    return (
        <div className='flex flex-col gap-6 p-6 h-full overflow-hidden'>
            {[...Array(6)].map((_, i) => (
                <div key={i} className={`flex items-end gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className='flex flex-col gap-1 w-full max-w-[60%]'>
                        <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
                        <Skeleton className="h-3 w-16 self-end" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Skeleton
