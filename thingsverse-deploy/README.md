# Install dependencies and Ansible Roles
```sh
sudo echo "deb http://download.virtualbox.org/virtualbox/debian stretch contrib" | sudo tee -a /etc/apt/sources.list

wget -q -O- https://www.virtualbox.org/download/oracle_vbox_2016.asc | sudo apt-key add

sudo echo "deb http://ppa.launchpad.net/ansible/ansible/ubuntu trusty main" | sudo tee -a /etc/apt/sources.list

sudo apt-get update

sudo apt-get -y install virtualbox-5.2

sudo apt-get -y install ansible

ansible-galaxy install ANXS.postgresql

ansible-galaxy install geerlingguy.redis

ansible-galaxy install jdauphant.nginx

vagrant up

vagrant ssh

sudo su -

cd .ssh

cat ssh/deploy.pub | sudo tee -a authorized_keys

exit

ssh root@127.0.0.1 -p 2222 -i ssh/deploy

```

## Install playbook
```sh
ansible-playbook -i inventory.ini backend.yml --private-key ssh/deploy
```

