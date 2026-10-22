import { Download, FileText, LockKeyhole } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import readme from '../../../migration-export/README.md?raw';
import report from '../../../migration-export/migration-report.md?raw';
import checklist from '../../../migration-export/migration-checklist.md?raw';
import packageUrl from '@/assets/migration-export-tools.zip?url';

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export default function AdminMigrationExport() {
  return <AdminLayout>
    <div className="max-w-3xl space-y-6 text-foreground">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Migration Export Center</h1>
        <p className="text-muted-foreground">Source Cloud unavailable · No user data exported</p>
      </header>
      <section className="border-y border-border py-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><LockKeyhole className="h-5 w-5" />Private exports unavailable</h2>
        <p className="text-sm text-muted-foreground">Reactivating Cloud is required. For the full database and accounts, open More → Database → Manage → Settings → Export data. Download storage files separately from More → Storage.</p>
        <p className="text-sm text-muted-foreground">Keep backups outside Git. The existing destination and the app’s connection have not been changed.</p>
      </section>
      <section className="divide-y divide-border">
        {['Database Inventory (.csv)', 'Database Records (.json/.csv)', 'Database Schema (.sql)', 'Storage Inventory (.csv)'].map(label => <div key={label} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <span className="font-medium">{label}</span>
          <Button variant="outline" disabled><LockKeyhole className="mr-2 h-4 w-4" />Unavailable</Button>
        </div>)}
        <div className="flex flex-wrap items-center justify-between gap-3 py-4"><span className="font-medium">Migration Report (.md)</span><Button variant="outline" onClick={() => downloadText(report, 'migration-report.md')}><Download className="mr-2 h-4 w-4" />Download report</Button></div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-4"><span className="font-medium">Export Tools Package (.zip) · No records</span><Button asChild><a href={packageUrl} download="migration-export-tools.zip"><Download className="mr-2 h-4 w-4" />Download tools</a></Button></div>
      </section>
      <section className="space-y-3">
        <h2 className="font-semibold">Owner-run handover</h2>
        <p className="text-sm text-muted-foreground">Source files: migration-export/ in the Code editor or connected repository. Selected-table exports require verified admin access and retain existing access restrictions.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => downloadText(readme, 'README.md')}><FileText className="mr-2 h-4 w-4" />Download instructions</Button>
          <Button variant="outline" onClick={() => downloadText(checklist, 'migration-checklist.md')}><FileText className="mr-2 h-4 w-4" />Download checklist</Button>
        </div>
      </section>
    </div>
  </AdminLayout>;
}