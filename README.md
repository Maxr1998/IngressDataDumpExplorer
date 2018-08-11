# IngressDataDumpExplorer
### About
IngressDataDumpExplorer is a set of tools that allows you to explore your Ingress gamedata that you got exported by Niantic as part of their GDPR compliance, by mailing `privacy@nianticlabs.com`.

**E-Mail template:**
> Dear Sir or Madam,  
> I'd like to request a dump of the raw data Niantic stores about my Ingress account @<account_name>, as regulated under GDPR.  
> Yours sincerely,  
> <your_name>

### How to use
You can run this program in docker with the following commands:

```bash
docker build . -t dump-explorer              # Needed once
docker run -p 8080:8080 dump-explorer:latest # Launch
```

You can then navigate to `localhost:8080` in your favorite Web browser (I only tested with Chrome).

**Warning:** For now, you need to execute the following command once, to fix the format errors in Niantic's dump. This will be integrated into the application in the future.

```bash
sed -i 's/None\tNone$/None/g' game_log.tsv
```