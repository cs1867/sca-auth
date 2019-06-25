%define install_base /usr/lib/perfsonar/psconfig-web-admin/auth
%define config_base %{install_base}/etc/perfsonar/psconfig-web
%define systemd_base /usr/lib/systemd/system
# cron/apache entries are located in the 'etc' directory
%define apache_base /etc/httpd/conf.d
%define apacheconf pwa-0auth.conf

%define perfsonar_auto_version 4.1.6
%define perfsonar_auto_relnum 1
%define debug_package %{nil}

Name:			perfsonar-psconfig-web-admin-auth
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR nodejs authentication module used by pSConfig Web Admin etc
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:		perfsonar-psconfig-web-admin-auth-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
#BuildArch:		noarch
BuildArch:		x86_64
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl
Requires:       sqlite

# Disable dtrace dependency, which rpm thinks is broken for some reason.
%global __requires_exclude dtrace

%description
The perfSONAR nodejs authentication module is a web-based, database-backed auth module and GUI. It's used by perfSONAR pSConfig Web Administrator, but this may expand.

%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfsonar-psconfig-web-admin-auth-%{version}.%{perfsonar_auto_relnum}

%build

%install
rm -rf %{buildroot}

# mkdirs
#ui/dist
#ui/images
#ui/js
#ui/scss
#ui/t
#ui/apidoc/css
#ui/apidoc/img
#ui/apidoc/locales
##ui/apidoc/vendor/prettify
#ui/apidoc/vendor

# do we need this one?
#deploy/docker/pwa-sample-config/scripts


make ROOTPATH=%{buildroot}/%{install_base} CONFIGPATH=%{buildroot}/%{config_base} install

rm -rf %{buildroot}/etc/pwa/apache/%{apacheconf}

rm -rf %{buildroot}/%{install_base}/

#mkdir -p %{buildroot}/etc/httpd/conf.d
#mkdir -p %{buildroot}/etc/apache
#mkdir -p %{buildroot}/etc/shared
#mkdir -p %{buildroot}/etc/pwa/apache
#mkdir -p %{buildroot}/etc/pwa/shared
#mkdir -p %{buildroot}/%{install_base}/shared
#mkdir -p %{buildroot}/%{install_base}/dist
mkdir -p %{buildroot}/%{systemd_base}
mkdir -p %{buildroot}/%{install_base}/bin
mkdir -p %{buildroot}/%{install_base}/config
mkdir -p %{buildroot}/%{install_base}/api/config
mkdir -p %{buildroot}/%{install_base}/api/models
mkdir -p %{buildroot}/%{install_base}/api/controllers
mkdir -p %{buildroot}/%{install_base}/node_modules
mkdir -p %{buildroot}/%{install_base}/ui/node_modules
mkdir -p %{buildroot}/%{install_base}/ui/css
mkdir -p %{buildroot}/%{install_base}/ui/js
mkdir -p %{buildroot}/%{install_base}/ui/t
mkdir -p %{buildroot}/%{install_base}/ui/images
mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/auth
mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/shared

cp -R node_modules/*     %{buildroot}/%{install_base}/node_modules
cp -R ui/node_modules/*  %{buildroot}/%{install_base}/ui/node_modules

#install -D -m 0644 etc/shared/*.js %{buildroot}/%{install_base}/shared

#install -D -m 0644 etc/index.js %{buildroot}/etc/pwa/index.js

install -D -m 0644  etc/apache/pwa-0auth.conf %{buildroot}/%{apache_base}/pwa-0auth.conf

#install -D -m 0644  etc/apache/pwa-admin.conf %{buildroot}/etc/pwa/apache

#install -D -m 0644 etc/apache/%{apacheconf} %{buildroot}/etc/apache/%{apacheconf}
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/%{apacheconf} %{buildroot}/etc/httpd/conf.d/%{apacheconf}

#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/* %{buildroot}/etc
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/auth/* %{buildroot}/etc
#install -D -m 0644 etc/shared/* %{buildroot}/etc/pwa/shared
#install -D -m 0644 etc/shared/* %{buildroot}/etc

# systemd unit files
install -D -m 0644 deploy/systemd/perfsonar-psconfig-web-admin-auth.service %{buildroot}/%{systemd_base}

# bin/ files
install -D -m 0755 bin/auth.js   %{buildroot}/%{install_base}/bin
install -D -m 0644 bin/usage.txt %{buildroot}/%{install_base}/bin
install -D -m 0755 bin/genkey.sh %{buildroot}/%{install_base}/bin
install -D -m 0755 bin/pwa_gen_keys.sh %{buildroot}/%{install_base}/bin

# api/config files
install -D -m 0644 etc/auth/index.js.sample %{buildroot}/etc/perfsonar/psconfig-web/auth/index.js
install -D -m 0644 etc/shared/auth.ui.js %{buildroot}/etc/perfsonar/psconfig-web/shared/auth.ui.js
install -D -m 0644 config/default.json %{buildroot}/%{install_base}/config/default.json

# api files
install -D -m 0644 api/*.js %{buildroot}/%{install_base}/api/
install -D -m 0644 api/controllers/*.js %{buildroot}/%{install_base}/api/controllers/
install -D -m 0644 api/models/*.js %{buildroot}/%{install_base}/api/models/

install -D -m 0644 ui/*.html %{buildroot}/%{install_base}/ui/
install -D -m 0644 ui/*.js %{buildroot}/%{install_base}/ui/
install -D -m 0644 ui/js/*.js %{buildroot}/%{install_base}/ui/js/
install -D -m 0644 ui/t/*.html %{buildroot}/%{install_base}/ui/t/
install -D -m 0644 ui/images/* %{buildroot}/%{install_base}/ui/images/
install -D -m 0644 ui/*.js.sample %{buildroot}/%{install_base}/ui/
install -D -m 0644 ui/css/style.* %{buildroot}/%{install_base}/ui/css/

rm -f %{buildroot}/etc/pwa/apache/%{apacheconf}
#rm -f %{buildroot}/%{install_base}/etc/pwa/%{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
mkdir -p /var/lib/perfsonar/psconfig-web-admin/auth
chown perfsonar:perfsonar /var/lib/perfsonar/psconfig-web-admin/auth
chown -R perfsonar:perfsonar %{install_base}
#chown -R apache:apache %{install_base}/etc/apache
chown -R apache:apache %{apache_base}

mkdir -p /usr/lib/perfsonar/psconfig-web-admin/auth/api/config
ln -sf /etc/perfsonar/psconfig-web/shared/auth.ui.js  /usr/lib/perfsonar/psconfig-web-admin/auth/ui/config.js
ln -sf /etc/perfsonar/psconfig-web/auth/index.js /usr/lib/perfsonar/psconfig-web-admin/auth/api/config/index.js

/usr/lib/perfsonar/psconfig-web-admin/auth/bin/pwa_gen_keys.sh

service httpd restart &> /dev/null || :

%files
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
#%config /etc/pwa/index.js
#%config /etc/pwa/shared/*
%config /etc/perfsonar/psconfig-web/auth/index.js
%config /etc/perfsonar/psconfig-web/shared/auth.ui.js
%config %{apache_base}/pwa-0auth.conf
%config %{systemd_base}/perfsonar-psconfig-web-admin-auth.service
%config %{install_base}/config/default.json
#%config %{install_base}/deploy/*
#%{install_base}/cgi-bin/*
%{install_base}/node_modules/*
%{install_base}/ui/node_modules/*
%{install_base}/ui/*
%{install_base}/ui/t/*.html
%{install_base}/ui/images/*
%{install_base}/ui/js/*
%{install_base}/ui/css/*
%{install_base}/bin/*
#%{install_base}/api/config/index.js.sample
#%{install_base}/ui/dist/*
#%{install_base}/shared/*
%{install_base}/api/*.js
#%{install_base}/api/admin/server.js
%{install_base}/api/controllers/*.js
%{install_base}/api/models/*.js
#%{install_base}/api/pub/*.js


# TODO: temporarily moved from MANIFEST
#api/pub/server.js
#api/pub/controllers.js
#api/pub/meshconfig.js

#%{install_base}/lib/perfSONAR_PS/*
#/etc/httpd/conf.d/*
#%config /etc/pwa/index.js
#%config /etc/pwa/shared/*
#%config /etc/pwa/apache/pwa-admin.conf

%changelog
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

