import { Button, Input, Typography } from "antd";
import { useState } from "react";

export default function PhoneDemo() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>Phone login demo</Typography.Title>
      <Typography.Paragraph>
        This is a phone login demo page. In production you should use a phone
        verification provider (e.g., Twilio, Firebase).
      </Typography.Paragraph>
      <Input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Enter phone number"
        style={{ width: 300, marginBottom: 8 }}
      />
      <br />
      <Button type="primary">Send code (Demo)</Button>
      <div style={{ marginTop: 12 }}>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          style={{ width: 300 }}
        />
        <Button style={{ marginLeft: 8 }}>Verify (Demo)</Button>
      </div>
    </div>
  );
}
