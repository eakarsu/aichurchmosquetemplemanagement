import React from 'react';
import { Sparkles } from 'lucide-react';
import AttendanceTrendChart from '../components/customViews/AttendanceTrendChart';
import MemberEngagementHeatmap from '../components/customViews/MemberEngagementHeatmap';
import BulletinPDF from '../components/customViews/BulletinPDF';
import MinistryRolesEditor from '../components/customViews/MinistryRolesEditor';

function CustomViewsPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
          <Sparkles size={28} color="#a78bfa" />
          Community Views
        </h1>
        <p style={{ color: '#94a3b8', marginTop: 8 }}>
          Custom member management views: attendance trends, engagement heatmap, weekly bulletin, and ministry roles editor.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
        <AttendanceTrendChart />
        <MemberEngagementHeatmap />
        <BulletinPDF />
        <MinistryRolesEditor />
      </div>
    </div>
  );
}

export default CustomViewsPage;
