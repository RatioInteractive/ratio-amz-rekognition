echo "STAGE: $1"
echo "REGION: $2"
echo "Plain text: $3"
echo "Object name: $4"

keyid=`printenv $1_KMS_KEY_ARN`
echo "AWS key-id: $keyid"

secretsBucket="s3://ratio-amz-rekognition-$1-secrets"
echo "S3 secrets bucket: $secretsBucket"

aws kms encrypt --key-id $keyid --region $2 --plaintext $3 | \
  python -c "import sys, json; print json.load(sys.stdin)['CiphertextBlob']" > $4 &&
  aws s3 mv $4 $secretsBucket/$4
