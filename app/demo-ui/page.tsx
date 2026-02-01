import { Button, Input, Card } from '@/components/ui';

export default function DemoUiPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-pastel-black mb-8">
        UI components (Nanny Whisperer palette)
      </h1>

      <section className="mb-10">
        <h2 className="text-lg font-medium text-dark-green mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-medium text-dark-green mb-4">Inputs</h2>
        <div className="max-w-sm space-y-4">
          <Input label="Text" placeholder="Enter text" />
          <Input label="Email" type="email" placeholder="you@example.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
          <Input label="With error" error="This field is required" />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-medium text-dark-green mb-4">Cards</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card>
            <h3 className="font-medium text-pastel-black">Simple card</h3>
            <p className="mt-2 text-sm text-dark-green/80">
              No image, no footer. Just content.
            </p>
          </Card>
          <Card
            footer={
              <Button variant="secondary" className="w-full">
                Action
              </Button>
            }
          >
            <h3 className="font-medium text-pastel-black">Card with footer</h3>
            <p className="mt-2 text-sm text-dark-green/80">
              Optional footer slot for actions.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
