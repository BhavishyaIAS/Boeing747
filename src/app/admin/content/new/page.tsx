import Link from "next/link";
import { Card, CardContent } from "@ui/card";
import { Button } from "@ui/button";
import { Input, Label, Select } from "@ui/field";
import { createContentAction } from "../actions";

export const dynamic = "force-dynamic";

const TYPES = ["NOTE", "MICRO_TOPIC", "MODEL_ANSWER", "FAQ", "EDITORIAL", "CURRENT_AFFAIR"];

export default function NewContentPage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 text-sm">
        <Link href="/admin/content" className="text-muted hover:text-foreground">
          ← Content
        </Link>
      </div>
      <h1 className="mb-4 text-2xl font-bold">New content</h1>
      <Card>
        <CardContent className="p-5">
          <form action={createContentAction} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required minLength={3} placeholder="e.g. Right to Life" />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue="NOTE">
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Button type="submit">Create draft</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
