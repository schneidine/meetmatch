from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='top_interests',
            field=models.ManyToManyField(blank=True, related_name='top_interest_users', to='users.interest'),
        ),
    ]
