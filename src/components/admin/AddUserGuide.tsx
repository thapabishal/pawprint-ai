import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SQL_TEMPLATE = `INSERT INTO public.user_profiles (
  id,
  full_name,
  role,
  programmes,
  phone,
  is_active
) VALUES (
  'PASTE_AUTH_USER_ID_HERE',
  'Full Name',
  'field_worker',
  '{"cnvr", "vaccination"}',
  '+977 98XXXXXXXX',
  true
);`;

const AddUserGuide: React.FC = () => {
  const { toast } = useToast();

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_TEMPLATE);
    toast({
      title: "Copied to clipboard",
      description: "SQL snippet is ready to paste.",
    });
  };

  return (
    <Card className="border-none bg-slate-900 text-white shadow-xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <Info size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Pilot Guide</span>
        </div>
        <CardTitle className="text-xl font-bold">Add New Team Member</CardTitle>
        <CardDescription className="text-slate-400">
          During the pilot, users must be created via the Supabase Dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="flex gap-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">1</div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">Create Auth User</p>
              <p className="text-xs text-slate-400">
                Go to <span className="text-blue-400 font-medium">Authentication &gt; Users</span> in Supabase and click "Add User".
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">2</div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">Copy User ID</p>
              <p className="text-xs text-slate-400">Copy the newly created UUID for the user.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">3</div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">Run SQL Snippet</p>
              <p className="text-xs text-slate-400">Paste the ID into the SQL editor and run the command below.</p>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute right-2 top-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
              onClick={copySQL}
            >
              <Copy size={16} />
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 text-[11px] leading-relaxed text-blue-100 font-mono border border-white/5">
            {SQL_TEMPLATE}
          </pre>
        </div>

        <Button
          variant="outline"
          className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          asChild
        >
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
            Open Supabase Dashboard
            <ExternalLink size={14} />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddUserGuide;
