import Link from 'next/link'
import { HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <Link href="/dashboard">
              <Button className="w-full flex justify-center py-2 px-4">
                <HomeIcon className="h-4 w-4 mr-2" />
                Go back to dashboard
              </Button>
            </Link>
            
            <Link href="/candidates">
              <Button
                variant="outline"
                className="w-full flex justify-center py-2 px-4"
              >
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Browse candidates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}