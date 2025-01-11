import { Content } from '@ai/components/content'
import { Footer } from '@ai/components/footer'
import { MenuBar } from '@ai/components/menu'
import { Sidebar } from '@ai/components/sidebar'
import { SplashLoading } from '@ai/components/splash'

export default function Home() {
  return (
    <SplashLoading>
      <div className="grid min-h-screen w-full grid-cols-[auto_1fr_auto] bg-background text-foregroun">
        <Sidebar />

        <div className="flex flex-col ">
          <MenuBar />
          <Content />
          <Footer />
          <div className="h-4 w-full dark:border-muted/40 bg-muted/50 sticky bottom-0 pt-4 z-50 backdrop-blur-lg" />
        </div>
      </div>
    </SplashLoading>
  )
}
