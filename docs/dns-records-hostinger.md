# alankarfashions.com — DNS records copied from Hostinger (1 Nov 2026)

Kept as-is when moving to Cloudflare (all set to **DNS only**, not proxied):

| Type | Name | Value | Priority | Purpose |
|---|---|---|---|---|
| MX | @ | mx1.hostinger.com | 5 | Hostinger email |
| MX | @ | mx2.hostinger.com | 10 | Hostinger email |
| TXT | @ | v=spf1 include:_spf.mail.hostinger.com ~all | | Email SPF |
| TXT | _dmarc | v=DMARC1; p=none | | DMARC |
| CNAME | hostingermail-a._domainkey | hostingermail-a.dkim.mail.hostinger.com | | Hostinger DKIM |
| CNAME | hostingermail-b._domainkey | hostingermail-b.dkim.mail.hostinger.com | | Hostinger DKIM |
| CNAME | hostingermail-c._domainkey | hostingermail-c.dkim.mail.hostinger.com | | Hostinger DKIM |
| CNAME | autodiscover | autodiscover.mail.hostinger.com | | Mail client setup |
| CNAME | autoconfig | autoconfig.mail.hostinger.com | | Mail client setup |
| TXT | resend._domainkey | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4WwGxZxJ0bgK2JgE5M2OkfpQ3A78y/kq/2JG1CJNrrUJl85Prgo8stVgC0XlX8EKzzsMvleamxHtrccvvVLOBISy0Pbik/8W0URUMBTWQn4cvMvMznqSy6+Od5N/qvRq9S7nPYObag3UOZkRwQNCHXsQkChDSMlnvyFZNCUoSXwIDAQAB | | Resend DKIM |
| CNAME | send | send.forge.rmta.net | | Resend return path |
| CNAME | rsend | rsend-apne1.forge.rmta.net | | Resend |

Replaced (old Hostinger website):
- ALIAS @ → alankarfashions.com.cdn.hstgr.net
- CNAME www → www.alankarfashions.com.cdn.hstgr.net

Now served by the Cloudflare Worker `alankar-fashions` (custom domains: alankarfashions.com, www.alankarfashions.com).
Old nameservers: ns1.dns-parking.com, ns2.dns-parking.com
