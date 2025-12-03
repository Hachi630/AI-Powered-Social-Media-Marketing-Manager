import { Card, Statistic, Tag, Button, Space } from "antd";
import { getLinkedInMetrics, getLinkedInAuthUrl } from "../services/linkedinService";
import { useState, useEffect } from "react";

interface LinkedInDashboardProps {
  jwt: string;
  userId?: string;
}

export default function LinkedInDashboard({ jwt, userId }: LinkedInDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (!jwt) return;
    getLinkedInMetrics(jwt).then(setMetrics);
  }, [jwt]);

  // Generate auth URL with userId for proper token association
  const authUrl = userId ? getLinkedInAuthUrl(userId) : undefined;

  return (
    <Space wrap size="large">
      {/* Followers */}
      <Card title="LinkedIn Followers">
        {metrics?.followers?.available ? (
          <Statistic value={metrics.followers.value} />
        ) : authUrl ? (
          <Button href={authUrl}>Connect LinkedIn</Button>
        ) : (
          <Tag color="warning">Please log in to connect LinkedIn</Tag>
        )}
      </Card>

      {/* Total Connections */}
      <Card title="Total Connections">
        {metrics?.connections?.available ? (
          <Statistic value={metrics.connections.value} />
        ) : (
          <Tag color="default">Not Available</Tag>
        )}
      </Card>

      {/* Profile Views */}
      <Card title="Profile Views (90 days)">
        <Tag color="default">Not supported by LinkedIn API</Tag>
      </Card>
    </Space>
  );
}
